<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RelatoriosGeradosNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $empresaId,
        private readonly string $dataRef,
        private readonly int $relatorioRunAprovadasId,
        private readonly int $relatorioRunIntegradasId
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'empresa_id' => $this->empresaId,
            'data_ref' => $this->dataRef,
            'relatorio_run_aprovadas_id' => $this->relatorioRunAprovadasId,
            'relatorio_run_integradas_id' => $this->relatorioRunIntegradasId,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Relatórios gerados - {$this->dataRef}")
            ->line('Os relatórios diários foram gerados:')
            ->line("Aprovadas (ID: {$this->relatorioRunAprovadasId})")
            ->line("Integradas (ID: {$this->relatorioRunIntegradasId})")
            ->line('Acesse o painel para baixar os arquivos.');
    }
}
