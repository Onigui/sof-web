<?php

namespace App\Services;

use App\Models\BillingInvoice;
use App\Models\BillingSetting;
use App\Models\EmpresaSubscription;
use App\Models\User;
use App\Notifications\InvoiceAbertaNotification;
use App\Notifications\InvoiceLembreteNotification;
use App\Notifications\SubscriptionSuspensaNotification;
use Carbon\Carbon;

class BillingCycleService
{
    public function __construct(private readonly BillingInvoiceService $invoiceService)
    {
    }

    public function generateMonthlyInvoicesForCurrentMonth(?string $month = null): void
    {
        $referenciaMes = $month ?? Carbon::now()->format('Y-m');
        $dueDay = (int) env('INVOICE_DUE_DAY', 5);

        BillingSetting::query()
            ->where('active', true)
            ->chunkById(100, function ($settings) use ($referenciaMes, $dueDay) {
                foreach ($settings as $setting) {
                    $invoice = $this->invoiceService->generateForMonth($setting->empresa_id, $referenciaMes);

                    $dueDate = $invoice->due_date
                        ?? Carbon::createFromFormat('Y-m', $referenciaMes)->day($dueDay)->toDateString();

                    $metadata = $invoice->metadata ?? [];

                    if ($invoice->total_centavos === 0) {
                        $invoice->status = BillingInvoice::STATUS_PAID;
                        $invoice->paid_at = $invoice->paid_at ?? now();
                    } else {
                        $invoice->status = BillingInvoice::STATUS_OPEN;
                    }

                    $invoice->due_date = $dueDate;
                    $invoice->metadata = $metadata;
                    $invoice->save();

                    if ($invoice->status === BillingInvoice::STATUS_OPEN && empty($metadata['notified_open'])) {
                        $this->notifyGestao(
                            $setting->empresa_id,
                            new InvoiceAbertaNotification($invoice->referencia_mes, $invoice->id)
                        );
                        $this->setMetadataFlag($invoice, 'notified_open');
                    }
                }
            });
    }

    public function runDunningForDate(?Carbon $date = null): void
    {
        $today = ($date ?? Carbon::today())->startOfDay();
        $beforeDays = (int) env('DUNNING_BEFORE_DAYS', 3);
        $afterDays = (int) env('DUNNING_AFTER_DAYS', 2);

        BillingInvoice::query()
            ->where('status', BillingInvoice::STATUS_OPEN)
            ->whereNotNull('due_date')
            ->chunkById(100, function ($invoices) use ($today, $beforeDays, $afterDays) {
                foreach ($invoices as $invoice) {
                    $metadata = $invoice->metadata ?? [];
                    $dueDate = Carbon::parse($invoice->due_date)->startOfDay();

                    if ($today->equalTo($dueDate->copy()->subDays($beforeDays))
                        && empty($metadata['reminded_before'])) {
                        $this->notifyGestao(
                            $invoice->empresa_id,
                            new InvoiceLembreteNotification($invoice->referencia_mes, $invoice->id, 'PRE')
                        );
                        $this->setMetadataFlag($invoice, 'reminded_before');
                        $metadata = $invoice->metadata ?? [];
                    }

                    if ($today->equalTo($dueDate->copy()->addDays($afterDays))
                        && empty($metadata['reminded_after'])) {
                        $this->notifyGestao(
                            $invoice->empresa_id,
                            new InvoiceLembreteNotification($invoice->referencia_mes, $invoice->id, 'POS')
                        );
                        $this->setMetadataFlag($invoice, 'reminded_after');
                        $metadata = $invoice->metadata ?? [];
                    }

                    $subscription = EmpresaSubscription::firstOrCreate(
                        ['empresa_id' => $invoice->empresa_id],
                        [
                            'status' => EmpresaSubscription::STATUS_TRIAL,
                            'trial_ends_at' => now()->addDays(14),
                            'grace_days' => 0,
                        ]
                    );

                    $suspensionDate = $dueDate->copy()->addDays($subscription->grace_days ?? 0);

                    if ($today->gt($suspensionDate) && empty($metadata['suspended_notified'])) {
                        $subscription->status = EmpresaSubscription::STATUS_SUSPENSA;
                        $subscription->suspended_at = now();
                        $subscription->save();

                        $this->notifyGestao(
                            $invoice->empresa_id,
                            new SubscriptionSuspensaNotification($invoice->referencia_mes)
                        );
                        $this->setMetadataFlag($invoice, 'suspended_notified');
                    }
                }
            });
    }

    private function notifyGestao(int $empresaId, $notification): void
    {
        User::query()
            ->where('empresa_id', $empresaId)
            ->where('role', User::ROLE_GESTAO)
            ->get()
            ->each(fn (User $user) => $user->notify($notification));
    }

    private function setMetadataFlag(BillingInvoice $invoice, string $flag): void
    {
        $metadata = $invoice->metadata ?? [];
        $metadata[$flag] = true;
        $invoice->metadata = $metadata;
        $invoice->save();
    }
}
