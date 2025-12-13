<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * Administra las tasas de cambio con caché local y fallback para modo demo.
 */
class ExchangeRateService
{
    /**
     * API: exchangerate-api.com (Free plan: 1500 req/mes)
     * Monedas sudamericanas soportadas:
     * - PEN (Perú)
     * - BRL (Brasil)
     * - CLP (Chile)
     * - COP (Colombia)
     * - ARS (Argentina)
     * - UYU (Uruguay)
     * - BOB (Bolivia)
     * - VES (Venezuela)
     * - ECU (Ecuador) - deprecated, usa USD
     */

    protected $baseCurrency = 'USD';
    protected $apiUrl = 'https://v6.exchangerate-api.com/v6';
    protected $cacheExpiry = 3600; // 1 hora en segundos

    public function __construct()
    {
        $this->apiKey = env('EXCHANGE_RATE_API_KEY', 'free');
    }

    /**
     * Obtener tasa de cambio (con caché)
     */
    public function getRate($toCurrency)
    {
        $toCurrency = strtoupper($toCurrency);

        // Buscar en caché si no está expirado
        $cached = ExchangeRate::where('to_currency', $toCurrency)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return $cached->rate;
        }

        // Obtener de API
        $rate = $this->fetchFromApi($toCurrency);

        if ($rate) {
            // Guardar en caché
            ExchangeRate::updateOrCreate(
                ['to_currency' => $toCurrency],
                [
                    'from_currency' => $this->baseCurrency,
                    'rate' => $rate,
                    'expires_at' => Carbon::now()->addSeconds($this->cacheExpiry),
                ]
            );

            return $rate;
        }

        return null;
    }

    /**
     * Obtener múltiples tasas
     */
    public function getRates(array $currencies)
    {
        $rates = [];

        foreach ($currencies as $currency) {
            $rate = $this->getRate($currency);
            if ($rate) {
                $rates[$currency] = $rate;
            }
        }

        return $rates;
    }

    /**
     * Obtener todas las tasas de cambio cacheadas
     */
    public function getAllCachedRates()
    {
        $cachedRates = ExchangeRate::where('expires_at', '>', now())
            ->get()
            ->mapWithKeys(fn($rate) => [$rate->to_currency => $rate->rate])
            ->toArray();

        if (empty($cachedRates)) {
            $cachedRates = $this->refreshAllRates();
        }

        return $cachedRates;
    }

    /**
     * Consumir API externa
     */
    protected function fetchFromApi($toCurrency)
    {
        try {
            // Para plan free, usar endpoint de latest rates
            $response = Http::timeout(10)->get(
                "{$this->apiUrl}/{$this->apiKey}/latest/{$this->baseCurrency}"
            );

            if ($response->successful()) {
                $data = $response->json();

                // Validar estructura de respuesta
                if (isset($data['conversion_rates'][$toCurrency])) {
                    return $data['conversion_rates'][$toCurrency];
                }
            }
        } catch (\Exception $e) {
            logger()->error('Error fetching exchange rate: ' . $e->getMessage());
        }

        // Modo demo: tasas ficticias para desarrollar sin API Key
        return $this->getDemoRate($toCurrency);
    }

    /**
     * Tasas de cambio demo para desarrollo
     */
    protected function getDemoRate($currency)
    {
        $demoRates = [
            'PEN' => 3.89,    // Perú
            'BRL' => 5.23,    // Brasil
            'CLP' => 890.50,  // Chile
            'COP' => 4150.00, // Colombia
            'ARS' => 1050.00, // Argentina
            'UYU' => 42.50,   // Uruguay
            'BOB' => 6.90,    // Bolivia
            'VES' => 36.50,   // Venezuela
            'EUR' => 0.92,    // Europa
            'MXN' => 17.20,   // México
        ];

        return $demoRates[strtoupper($currency)] ?? null;
    }

    /**
     * Actualizar todas las tasas de cambio
     */
    public function refreshAllRates()
    {
        $currencies = ['PEN', 'BRL', 'CLP', 'COP', 'ARS', 'UYU', 'BOB', 'VES', 'EUR', 'MXN'];

        $refreshedRates = [];

        foreach ($currencies as $currency) {
            $rate = $this->getRate($currency);
            if ($rate !== null) {
                $refreshedRates[$currency] = $rate;
            }
        }

        return $refreshedRates;
    }
}
