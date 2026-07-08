<?php

namespace App\Services\Payments;

use App\Models\BillingInvoice;
use Illuminate\Http\Request;

interface PaymentProvider
{
    public function createCheckout(BillingInvoice $invoice): array;

    public function verifyWebhook(Request $request): array;
}
