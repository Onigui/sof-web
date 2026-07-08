<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Pendencia;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PendenciaFilaTest extends TestCase
{
    use RefreshDatabase;

    public function test_analista_consegue_criar_pendencia(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $operador->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        Sanctum::actingAs($analista);

        $response = $this->postJson("/api/v1/propostas/{$proposta->id}/pendencias", [
            'categoria' => 'Documentos',
            'comentario' => 'Faltou documento',
            'itens' => [
                ['doc_tipo' => 'RG', 'obrigatorio' => true],
            ],
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('pendencias', [
            'proposta_id' => $proposta->id,
            'status' => Pendencia::STATUS_ABERTA,
        ]);

        $this->assertDatabaseHas('propostas', [
            'id' => $proposta->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
        ]);
    }

    public function test_operador_de_outra_empresa_nao_ve_pendencias(): void
    {
        $empresaA = Empresa::factory()->create();
        $empresaB = Empresa::factory()->create();
        $produto = Produto::factory()->create();

        $operadorA = User::factory()->create([
            'empresa_id' => $empresaA->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $operadorB = User::factory()->create([
            'empresa_id' => $empresaB->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresaB->id,
            'operador_id' => $operadorB->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Norte',
            'cliente_nome' => 'Outro Cliente',
            'cliente_cpf' => '99988877766',
            'cliente_celular' => '11988887777',
        ]);

        Pendencia::create([
            'empresa_id' => $empresaB->id,
            'proposta_id' => $proposta->id,
            'categoria' => 'Cadastro',
            'status' => Pendencia::STATUS_ABERTA,
            'criada_por' => $operadorB->id,
            'criada_em' => now(),
        ]);

        Sanctum::actingAs($operadorA);

        $this->getJson("/api/v1/propostas/{$proposta->id}/pendencias")
            ->assertNotFound();
    }

    public function test_operador_dono_consegue_resolver_pendencia(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $operador->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente A',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        $pendencia = Pendencia::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'categoria' => 'Documentos',
            'status' => Pendencia::STATUS_ABERTA,
            'criada_por' => $operador->id,
            'criada_em' => now(),
        ]);

        Sanctum::actingAs($operador);

        $this->patchJson("/api/v1/pendencias/{$pendencia->id}/resolver")
            ->assertOk();

        $this->assertDatabaseHas('pendencias', [
            'id' => $pendencia->id,
            'status' => Pendencia::STATUS_RESOLVIDA,
            'resolvida_por' => $operador->id,
        ]);
    }

    public function test_fila_so_acessivel_para_analista_ou_gestao(): void
    {
        $empresa = Empresa::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        Sanctum::actingAs($operador);

        $this->getJson('/api/v1/fila')
            ->assertForbidden();
    }

    public function test_fila_retorna_has_pendencia_aberta(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $operador->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Fila',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        Pendencia::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'categoria' => 'Documentos',
            'status' => Pendencia::STATUS_ABERTA,
            'criada_por' => $analista->id,
            'criada_em' => now(),
        ]);

        Sanctum::actingAs($analista);

        $response = $this->getJson('/api/v1/fila');

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $proposta->id,
            'has_pendencia_aberta' => true,
        ]);
    }
}
