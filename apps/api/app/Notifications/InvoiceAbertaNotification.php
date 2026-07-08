<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceAbertaNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $referenciaMes, private readonly int $invoiceId)
    {
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
            'tipo' => 'INVOICE_OPEN',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Fatura aberta - {$this->referenciaMes}")
            ->line("A fatura do mês {$this->referenciaMes} está aberta.")
            ->line("Invoice ID: {$this->invoiceId}")
            ->line('Acesse o painel para concluir o pagamento.');
    }
}
