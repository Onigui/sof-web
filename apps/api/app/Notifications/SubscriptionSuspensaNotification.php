<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionSuspensaNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $referenciaMes)
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
            'tipo' => 'SUBSCRIPTION_SUSPENDED',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Assinatura suspensa por falta de pagamento')
            ->line("A assinatura foi suspensa por falta de pagamento da fatura {$this->referenciaMes}.")
            ->line('Regularize o pagamento para reativar o acesso.');
    }
}
