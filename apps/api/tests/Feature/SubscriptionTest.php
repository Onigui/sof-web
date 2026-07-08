<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\EmpresaSubscription;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_integrar_bloqueia_quando_trial_expirou(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        EmpresaSubscription::create([
            'empresa_id' => $empresa->id,
            'status' => EmpresaSubscription::STATUS_TRIAL,
            'trial_ends_at' => Carbon::now()->subDay(),
            'grace_days' => 0,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_FORMALIZACAO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        Sanctum::actingAs($gestao);

        $this->postJson("/api/v1/propostas/{$proposta->id}/integrar", [
            'data_averbacao' => now()->toDateString(),
            'contrato' => 'CTR-123',
        ])->assertStatus(402)
            ->assertJsonFragment([
                'error' => 'subscription_required',
            ]);
    }

    public function test_gestao_pode_atualizar_subscription(): void
    {
        $empresa = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        Sanctum::actingAs($gestao);

        $this->patchJson('/api/v1/subscription', [
            'status' => 'ATIVA',
            'grace_days' => 2,
        ])->assertOk()
            ->assertJsonFragment([
                'status' => 'ATIVA',
                'grace_days' => 2,
            ]);
    }

    public function test_operador_nao_acessa_subscription_endpoints(): void
    {
        $empresa = Empresa::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        Sanctum::actingAs($operador);

        $this->getJson('/api/v1/subscription')->assertForbidden();
        $this->patchJson('/api/v1/subscription', [
            'status' => 'ATIVA',
        ])->assertForbidden();

        Sanctum::actingAs($analista);

        $this->getJson('/api/v1/subscription')->assertForbidden();
    }

    public function test_multi_tenant_subscription_update_nao_afeta_outra_empresa(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();

        $gestao = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_GESTAO,
        ]);

        EmpresaSubscription::create([
            'empresa_id' => $empresaB->id,
            'status' => EmpresaSubscription::STATUS_SUSPENSA,
            'trial_ends_at' => Carbon::now()->addDays(5),
            'grace_days' => 0,
        ]);

        Sanctum::actingAs($gestao);

        $this->patchJson('/api/v1/subscription', [
            'status' => 'ATIVA',
            'grace_days' => 1,
        ])->assertOk();

        $this->assertDatabaseHas('empresa_subscriptions', [
            'empresa_id' => $empresaB->id,
            'status' => EmpresaSubscription::STATUS_SUSPENSA,
        ]);
    }
}
