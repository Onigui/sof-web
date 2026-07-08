<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Empresa;
use App\Models\Pendencia;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAcoesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestao_transfere_proposta(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);
        $operadorAnterior = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);
        $novoOperador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $operadorAnterior->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Transferencia',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
        ]);

        Sanctum::actingAs($gestao);

        $response = $this->postJson("/api/v1/propostas/{$proposta->id}/transferir", [
            'novo_operador_id' => $novoOperador->id,
            'motivo' => 'Redistribuição',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('propostas', [
            'id' => $proposta->id,
            'operador_id' => $novoOperador->id,
        ]);

        $audit = AuditLog::query()
            ->where('action', 'PROPOSTA_TRANSFERIDA')
            ->where('entity_id', (string) $proposta->id)
            ->first();

        $this->assertNotNull($audit);
        $this->assertSame($operadorAnterior->id, $audit->metadata['from']);
        $this->assertSame($novoOperador->id, $audit->metadata['to']);
    }

    public function test_analista_e_operador_recebem_403_ao_transferir(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $operador = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_OPERADOR,
        ]);
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $operador->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Transferencia',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
        ]);

        foreach ([$operador, $analista] as $user) {
            Sanctum::actingAs($user);

            $this->postJson("/api/v1/propostas/{$proposta->id}/transferir", [
                'novo_operador_id' => $operador->id,
                'motivo' => 'Teste',
            ])->assertForbidden();
        }
    }

    public function test_reabrir_pendencia_funciona_e_e_idempotente(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Pendencia',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
        ]);

        $pendencia = Pendencia::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'categoria' => 'Docs',
            'comentario' => 'Falta documento',
            'status' => Pendencia::STATUS_RESOLVIDA,
            'criada_por' => $gestao->id,
            'criada_em' => now()->subDay(),
            'resolvida_por' => $gestao->id,
            'resolvida_em' => now(),
        ]);

        Sanctum::actingAs($gestao);

        $this->postJson("/api/v1/pendencias/{$pendencia->id}/reabrir", [
            'motivo' => 'Documento inválido',
        ])->assertOk();

        $pendenciaAtualizada = $pendencia->fresh();

        $this->assertSame(Pendencia::STATUS_ABERTA, $pendenciaAtualizada->status);
        $this->assertNull($pendenciaAtualizada->resolvida_por);
        $this->assertNull($pendenciaAtualizada->resolvida_em);
        $this->assertSame('Documento inválido', $pendenciaAtualizada->metadata['motivo']);
        $this->assertSame($gestao->id, $pendenciaAtualizada->metadata['reaberta_por']);

        $this->postJson("/api/v1/pendencias/{$pendencia->id}/reabrir", [
            'motivo' => 'Documento inválido',
        ])->assertOk();

        $this->assertSame(1, AuditLog::query()
            ->where('action', 'PENDENCIA_REABERTA')
            ->where('entity_id', (string) $pendencia->id)
            ->count());
    }

    public function test_ajustar_status_bloqueia_integrada(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $gestao = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_GESTAO,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $gestao->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Status',
            'cliente_cpf' => '12345678900',
            'cliente_celular' => '11999999999',
        ]);

        Sanctum::actingAs($gestao);

        $this->postJson("/api/v1/propostas/{$proposta->id}/ajustar-status", [
            'status_novo' => Proposta::STATUS_INTEGRADA,
            'motivo' => 'Ajuste manual',
        ])->assertStatus(422);
    }
}
