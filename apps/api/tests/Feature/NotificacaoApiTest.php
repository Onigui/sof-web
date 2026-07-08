<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use App\Notifications\RelatoriosGeradosNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificacaoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_listar_notificacoes_retorna_apenas_do_usuario(): void
    {
        $empresa = Empresa::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);
        $otherUser = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => RelatoriosGeradosNotification::class,
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => [
                'empresa_id' => $empresa->id,
                'data_ref' => '2025-01-10',
                'relatorio_run_aprovadas_id' => 1,
                'relatorio_run_integradas_id' => 2,
            ],
        ]);

        DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => RelatoriosGeradosNotification::class,
            'notifiable_type' => User::class,
            'notifiable_id' => $otherUser->id,
            'data' => [
                'empresa_id' => $empresa->id,
                'data_ref' => '2025-01-10',
                'relatorio_run_aprovadas_id' => 3,
                'relatorio_run_integradas_id' => 4,
            ],
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/notificacoes')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_marcar_notificacao_como_lida_so_para_o_usuario(): void
    {
        $empresa = Empresa::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);
        $otherUser = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $notification = DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => RelatoriosGeradosNotification::class,
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => [
                'empresa_id' => $empresa->id,
                'data_ref' => '2025-01-10',
                'relatorio_run_aprovadas_id' => 1,
                'relatorio_run_integradas_id' => 2,
            ],
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/notificacoes/'.$notification->id.'/ler')
            ->assertOk();

        $this->assertNotNull($notification->fresh()->read_at);

        Sanctum::actingAs($otherUser);

        $this->postJson('/api/v1/notificacoes/'.$notification->id.'/ler')
            ->assertNotFound();
    }
}
