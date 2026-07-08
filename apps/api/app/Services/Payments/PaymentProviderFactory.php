<?php

namespace App\Services\Payments;

use App\Billing\Providers\MercadoPagoProvider;
use InvalidArgumentException;

class PaymentProviderFactory
{
    public function make(string $provider): PaymentProvider
    {
        return match ($provider) {
            'mercadopago' => new MercadoPagoProvider(),
            'manual' => new ManualPaymentProvider(),
            default => throw new InvalidArgumentException('Provider not supported.'),
        };
    }
}
