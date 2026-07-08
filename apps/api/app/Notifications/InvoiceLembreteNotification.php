<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceLembreteNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $referenciaMes,
        private readonly int $invoiceId,
        private readonly string $tipo
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'referencia_mes' => $this->referenciaMes,
            'invoice_id' => $this->invoiceId,
            'tipo' => $this->tipo,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = $this->tipo === 'PRE' ? 'Pré-vencimento' : 'Pós-vencimento';

        return (new MailMessage())
            ->subject("Lembrete de fatura ({$label}) - {$this->referenciaMes}")
            ->line("Lembrete {$label} da fatura {$this->referenciaMes}.")
            ->line("Invoice ID: {$this->invoiceId}")
            ->line('Acesse o painel para efetuar o pagamento.');
    }
}
