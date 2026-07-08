<?php

namespace Tests\Feature;

use App\Models\BillingEvent;
use App\Models\BillingSetting;
use App\Models\Empresa;
use App\Models\Integracao;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_integrar_cria_billing_event_uma_vez(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        BillingSetting::create([
            'empresa_id' => $empresa->id,
            'monthly_fee_centavos' => 1000,
            'per_integrada_centavos' => 500,
            'currency' => 'BRL',
            'active' => true,
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
        ])->assertCreated();

        $this->assertDatabaseHas('billing_events', [
            'empresa_id' => $empresa->id,
            'tipo_evento' => BillingEvent::TIPO_INTEGRADA,
            'proposta_id' => $proposta->id,
            'valor_centavos' => 500,
        ]);
    }

    public function test_summary_calcula_corretamente(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        BillingSetting::create([
            'empresa_id' => $empresa->id,
            'monthly_fee_centavos' => 1000,
            'per_integrada_centavos' => 200,
            'currency' => 'BRL',
            'active' => true,
        ]);

        $proposta1 = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_INTEGRADA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        $proposta2 = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_INTEGRADA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente B',
            'cliente_cpf' => '98798798700',
            'cliente_celular' => '11911112222',
        ]);

        $integracao1 = Integracao::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta1->id,
            'data_averbacao' => '2025-01-10',
            'contrato' => 'CTR-1',
            'created_by' => $gestao->id,
        ]);

        $integracao2 = Integracao::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta2->id,
            'data_averbacao' => '2025-01-11',
            'contrato' => 'CTR-2',
            'created_by' => $gestao->id,
        ]);

        BillingEvent::create([
            'empresa_id' => $empresa->id,
            'tipo_evento' => BillingEvent::TIPO_INTEGRADA,
            'proposta_id' => $proposta1->id,
            'integracao_id' => $integracao1->id,
            'valor_centavos' => 200,
            'gerado_em' => Carbon::parse('2025-01-10 10:00:00'),
        ]);

        BillingEvent::create([
            'empresa_id' => $empresa->id,
            'tipo_evento' => BillingEvent::TIPO_INTEGRADA,
            'proposta_id' => $proposta2->id,
            'integracao_id' => $integracao2->id,
            'valor_centavos' => 200,
            'gerado_em' => Carbon::parse('2025-01-20 12:00:00'),
        ]);

        $empresaB = Empresa::factory()->create();
        BillingEvent::create([
            'empresa_id' => $empresaB->id,
            'tipo_evento' => BillingEvent::TIPO_INTEGRADA,
            'proposta_id' => null,
            'integracao_id' => null,
            'valor_centavos' => 999,
            'gerado_em' => Carbon::parse('2025-01-15 12:00:00'),
        ]);

        Sanctum::actingAs($gestao);

        $this->getJson('/api/v1/billing/summary?month=2025-01')
            ->assertOk()
            ->assertJsonFragment([
                'total_integradas' => 2,
                'total_variavel_centavos' => 400,
                'mensalidade_centavos' => 1000,
                'total_centavos' => 1400,
            ]);
    }

    public function test_operador_analista_nao_acessam_billing(): void
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
        $this->getJson('/api/v1/billing/summary?month=2025-01')->assertForbidden();
        $this->getJson('/api/v1/billing/events?month=2025-01')->assertForbidden();
        $this->patchJson('/api/v1/billing/settings', [
            'monthly_fee_centavos' => 1000,
            'per_integrada_centavos' => 200,
            'active' => true,
        ])->assertForbidden();

        Sanctum::actingAs($analista);
        $this->getJson('/api/v1/billing/summary?month=2025-01')->assertForbidden();
    }
}
