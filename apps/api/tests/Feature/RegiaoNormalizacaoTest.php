<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\Regiao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegiaoNormalizacaoTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestao_lista_regioes_pendentes(): void
    {
        $empresa = Empresa::factory()->create();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);
        $produto = Produto::factory()->create();

        Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Zona Sul',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11999990000',
        ]);

        Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $user->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Zona Sul',
            'cliente_nome' => 'Cliente B',
            'cliente_cpf' => '22222222222',
            'cliente_celular' => '11999990001',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/regioes/pending-normalization')
            ->assertOk()
            ->assertJsonFragment([
                'raw_text' => 'Zona Sul',
                'total' => 2,
            ]);
    }

    public function test_operador_e_analista_recebem_403(): void
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
        $this->getJson('/api/v1/regioes/pending-normalization')->assertForbidden();

        Sanctum::actingAs($analista);
        $this->getJson('/api/v1/regioes/pending-normalization')->assertForbidden();
    }

    public function test_normalizacao_atualiza_apenas_empresa_correta(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_GESTAO,
        ]);
        $produto = Produto::factory()->create();

        $regiao = Regiao::create(['name' => 'Sul']);

        $propostaA = Proposta::create([
            'empresa_id' => $empresaA->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Zona Sul',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11999990000',
        ]);

        $propostaB = Proposta::create([
            'empresa_id' => $empresaB->id,
            'operador_id' => User::factory()->create(['empresa_id' => $empresaB->id])->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Zona Sul',
            'cliente_nome' => 'Cliente B',
            'cliente_cpf' => '22222222222',
            'cliente_celular' => '11999990001',
        ]);

        Sanctum::actingAs($gestao);

        $this->postJson('/api/v1/regioes/normalize', [
            'raw_text' => 'Zona Sul',
            'regiao_id' => $regiao->id,
        ])->assertOk()->assertJsonFragment([
            'raw_text' => 'Zona Sul',
            'regiao_id' => $regiao->id,
            'total_atualizado' => 1,
        ]);

        $this->assertDatabaseHas('propostas', [
            'id' => $propostaA->id,
            'regiao_id' => $regiao->id,
        ]);

        $this->assertDatabaseHas('propostas', [
            'id' => $propostaB->id,
            'regiao_id' => null,
        ]);
    }
}
