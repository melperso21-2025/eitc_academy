<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExchangeRateService;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    protected $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * GET /api/exchange-rates
     * Obtener todas las tasas de cambio cacheadas
     */
    public function index()
    {
        $rates = $this->exchangeRateService->getAllCachedRates();

        return response()->json([
            'success' => true,
            'base_currency' => 'USD',
            'rates' => $rates,
            'message' => 'Tasas de cambio obtenidas correctamente',
        ]);
    }

    /**
     * GET /api/exchange-rates/{currency}
     * Obtener tasa específica
     */
    public function show($currency)
    {
        $rate = $this->exchangeRateService->getRate($currency);

        if (!$rate) {
            return response()->json([
                'success' => false,
                'message' => "No se pudo obtener la tasa para {$currency}",
            ], 400);
        }

        return response()->json([
            'success' => true,
            'from' => 'USD',
            'to' => strtoupper($currency),
            'rate' => $rate,
        ]);
    }

    /**
     * POST /api/exchange-rates/refresh
     * Actualizar todas las tasas (solo admin)
     */
    public function refresh(Request $request)
    {
        // Validar que sea admin
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $rates = $this->exchangeRateService->refreshAllRates();

        return response()->json([
            'success' => true,
            'message' => 'Tasas de cambio actualizadas',
            'rates' => $rates,
        ]);
    }

    /**
     * GET /api/exchange-rates/convert
     * Convertir monto de USD a otra moneda
     * Ejemplo: /api/exchange-rates/convert?amount=100&to=PEN
     */
    public function convert(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'to' => 'required|string|size:3',
        ]);

        $rate = $this->exchangeRateService->getRate($validated['to']);

        if (!$rate) {
            return response()->json([
                'success' => false,
                'message' => "No se pudo obtener la tasa para {$validated['to']}",
            ], 400);
        }

        $converted = $validated['amount'] * $rate;

        return response()->json([
            'success' => true,
            'from' => 'USD',
            'to' => strtoupper($validated['to']),
            'amount_usd' => $validated['amount'],
            'converted_amount' => round($converted, 2),
            'rate' => $rate,
        ]);
    }
}
