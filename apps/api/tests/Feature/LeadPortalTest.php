<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Lead;
use App\Models\Loja;
use App\Models\Produto;
use App\Models\Proposta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_loja_so_ve_leads_da_propria_loja(): void
    {
        $empresa = Empresa::factory()->create();
        $lojaA = Loja::create(['name' => 'Loja A']);
        $lojaB = Loja::create(['name' => 'Loja B']);

        $userLoja = User::factory()->create([
            'empresa_id' => $empresa->id,
            'loja_id' => $lojaA->id,
            'role' => User::ROLE_LOJA,
        ]);

        $leadA = Lead::create([
            'empresa_id' => $empresa->id,
            'loja_id' => $lojaA->id,
            'cliente_nome' => 'Cliente A',
            'cliente_celular' => '11999999999',
            'status' => Lead::STATUS_NOVO,
        ]);

        Lead::create([
            'empresa_id' => $empresa->id,
            'loja_id' => $lojaB->id,
            'cliente_nome' => 'Cliente B',
            'cliente_celular' => '11888888888',
            'status' => Lead::STATUS_NOVO,
        ]);

        Sanctum::actingAs($userLoja);

        $response = $this->getJson('/api/v1/loja/leads');

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $leadA->id,
        ]);
        $response->assertJsonCount(1, 'data.data');
    }

    public function test_converter_cria_proposta_e_marca_lead_convertido(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $loja = Loja::create(['name' => 'Loja Conversao']);

        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $lead = Lead::create([
            'empresa_id' => $empresa->id,
            'loja_id' => $loja->id,
            'status' => Lead::STATUS_NOVO,
            'cliente_nome' => 'Cliente Lead',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
            'placa' => 'ABC1234',
            'renavam' => '123456789',
            'descricao' => 'Carro usado',
            'valor_veiculo' => 50000,
            'valor_solicitado' => 30000,
            'produto_id' => $produto->id,
        ]);

        Sanctum::actingAs($analista);

        $response = $this->postJson("/api/v1/leads/{$lead->id}/converter");

        $response->assertOk();

        $lead->refresh();

        $this->assertSame(Lead::STATUS_CONVERTIDO, $lead->status);
        $this->assertNotNull($lead->convertido_proposta_id);

        $this->assertDatabaseHas('propostas', [
            'id' => $lead->convertido_proposta_id,
            'empresa_id' => $empresa->id,
            'loja_id' => $loja->id,
            'cliente_nome' => $lead->cliente_nome,
            'cliente_cpf' => $lead->cliente_cpf,
            'cliente_celular' => $lead->cliente_celular,
            'veiculo_placa' => $lead->placa,
            'veiculo_renavam' => $lead->renavam,
            'veiculo_descricao' => $lead->descricao,
            'valor_financiado' => $lead->valor_solicitado,
            'status' => Proposta::STATUS_RASCUNHO,
        ]);
    }

    public function test_operador_nao_acessa_endpoints_de_leads(): void
    {
        $empresa = Empresa::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        Sanctum::actingAs($operador);

        $this->getJson('/api/v1/leads')->assertForbidden();
        $this->getJson('/api/v1/loja/leads')->assertForbidden();
    }
}
