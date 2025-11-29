<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Illuminate\Console\Command;

class RefreshExchangeRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exchange:refresh';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar tasas de cambio desde API externa';

    /**
     * Execute the console command.
     */
    public function handle(ExchangeRateService $exchangeRateService)
    {
        $this->info('Actualizando tasas de cambio...');

        $rates = $exchangeRateService->refreshAllRates();

        if (!empty($rates)) {
            $this->info('✓ Tasas actualizadas correctamente:');
            foreach ($rates as $currency => $rate) {
                $this->line("  1 USD = {$rate} {$currency}");
            }
        } else {
            $this->error('✗ Error al actualizar tasas. Verifica tu API Key.');
        }
    }
}
