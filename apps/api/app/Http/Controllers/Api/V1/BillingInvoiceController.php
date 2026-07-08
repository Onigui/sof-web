<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingInvoice;
use App\Models\BillingPaymentAttempt;
use App\Models\EmpresaSubscription;
use App\Models\User;
use App\Services\BillingInvoiceService;
use App\Services\Payments\PaymentProviderFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingInvoiceController extends Controller
{
    public function show(Request $request, BillingInvoiceService $service): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $invoice = $service->generateForMonth($user->empresa_id, $validated['month']);

        return response()->json([
            'data' => $invoice,
        ]);
    }

    public function checkout(
        Request $request,
        BillingInvoice $invoice,
        PaymentProviderFactory $factory
    ): JsonResponse {
        $user = $request->user();
        $this->authorizeGestao($user);

        if ($invoice->empresa_id !== $user->empresa_id) {
            abort(404);
        }

        $provider = $request->input('provider')
            ?? $invoice->provider
            ?? (env('MERCADOPAGO_ACCESS_TOKEN') ? 'mercadopago' : 'manual');
        $provider = $invoice->provider ?? 'manual';
        $gateway = $factory->make($provider);
        $checkout = $gateway->createCheckout($invoice);

        $attempt = BillingPaymentAttempt::create([
            'empresa_id' => $user->empresa_id,
            'billing_invoice_id' => $invoice->id,
            'provider' => $provider,
            'status' => BillingPaymentAttempt::STATUS_REDIRECTED,
            'provider_payment_id' => $checkout['provider_invoice_id'] ?? null,
            'checkout_url' => $checkout['checkout_url'] ?? null,
            'created_by' => $user->id,
        ]);

        $invoice->update([
            'provider' => $provider,
            'provider_invoice_id' => $checkout['provider_invoice_id'] ?? null,
            'provider_checkout_url' => $checkout['checkout_url'] ?? null,
        ]);

        return response()->json([
            'data' => [
                'checkout_url' => $attempt->checkout_url,
            ],
        ]);
    }

    public function markPaid(Request $request, BillingInvoice $invoice): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        if ($invoice->empresa_id !== $user->empresa_id) {
            abort(404);
        }

        $metadata = $invoice->metadata ?? [];
        $metadata['manual_override'] = true;

        $invoice->update([
            'status' => BillingInvoice::STATUS_PAID,
            'paid_at' => now(),
            'metadata' => $metadata,
        ]);

        $this->activateSubscription($user->empresa_id);

        return response()->json([
            'data' => $invoice,
        ]);
    }

    private function authorizeGestao(User $user): void
    {
        if ($user->role !== User::ROLE_GESTAO) {
            abort(403);
        }
    }

    private function activateSubscription(int $empresaId): void
    {
        $subscription = EmpresaSubscription::firstOrCreate(
            ['empresa_id' => $empresaId],
            [
                'status' => EmpresaSubscription::STATUS_TRIAL,
                'trial_ends_at' => now()->addDays(14),
                'grace_days' => 0,
            ]
        );

        if ($subscription->status !== EmpresaSubscription::STATUS_ATIVA) {
            $subscription->status = EmpresaSubscription::STATUS_ATIVA;
        }

        if ($subscription->active_since === null) {
            $subscription->active_since = now();
        }

        $subscription->save();
    }
}
