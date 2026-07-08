<?php

namespace Tests\Feature;

use App\Models\Documento;
use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentoValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_validacao_manual_seta_validado_por_e_em(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $analista->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Doc',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        $documento = Documento::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'tipo' => 'CNH',
            'arquivo_path' => 'docs/cnh.pdf',
            'mime_type' => 'application/pdf',
            'tamanho_bytes' => 30000,
            'enviado_por' => $analista->id,
            'enviado_em' => now(),
            'status' => Documento::STATUS_ENVIADO,
        ]);

        Sanctum::actingAs($analista);

        $this->patchJson("/api/v1/documentos/{$documento->id}/validar", [
            'status' => Documento::STATUS_VALIDO,
        ])->assertOk();

        $documentoAtualizado = $documento->fresh();

        $this->assertSame(Documento::STATUS_VALIDO, $documentoAtualizado->status);
        $this->assertSame($analista->id, $documentoAtualizado->validado_por);
        $this->assertNotNull($documentoAtualizado->validado_em);
    }

    public function test_auto_validate_invalida_arquivo_pequeno(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $analista->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Doc',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        $documento = Documento::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'tipo' => 'CNH',
            'arquivo_path' => 'docs/cnh.jpg',
            'mime_type' => 'image/jpeg',
            'tamanho_bytes' => 1000,
            'enviado_por' => $analista->id,
            'enviado_em' => now(),
            'status' => Documento::STATUS_ENVIADO,
        ]);

        Sanctum::actingAs($analista);

        $response = $this->postJson("/api/v1/propostas/{$proposta->id}/documentos/auto-validate");

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $documento->id,
            'tipo' => 'CNH',
            'motivo' => 'arquivo muito pequeno/ilegível.',
        ]);

        $documentoAtualizado = $documento->fresh();
        $this->assertSame(Documento::STATUS_INVALIDO, $documentoAtualizado->status);
    }

    public function test_auto_validate_invalida_foto_veiculo_em_pdf(): void
    {
        $empresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $analista->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Doc',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        $documento = Documento::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'tipo' => 'FOTO_VEICULO',
            'arquivo_path' => 'docs/foto.pdf',
            'mime_type' => 'application/pdf',
            'tamanho_bytes' => 30000,
            'enviado_por' => $analista->id,
            'enviado_em' => now(),
            'status' => Documento::STATUS_ENVIADO,
        ]);

        Sanctum::actingAs($analista);

        $response = $this->postJson("/api/v1/propostas/{$proposta->id}/documentos/auto-validate");

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $documento->id,
            'tipo' => 'FOTO_VEICULO',
            'motivo' => 'tipo de documento requer imagem.',
        ]);
    }

    public function test_auto_validate_respeita_multi_tenant(): void
    {
        $empresa = Empresa::factory()->create();
        $outraEmpresa = Empresa::factory()->create();
        $produto = Produto::factory()->create();
        $analista = User::factory()->create([
            'empresa_id' => $empresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);
        $userOutraEmpresa = User::factory()->create([
            'empresa_id' => $outraEmpresa->id,
            'role' => User::ROLE_ANALISTA,
        ]);

        $proposta = Proposta::create([
            'empresa_id' => $empresa->id,
            'operador_id' => $analista->id,
            'produto_id' => $produto->id,
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Centro',
            'cliente_nome' => 'Cliente Doc',
            'cliente_cpf' => '39053344705',
            'cliente_celular' => '11999999999',
        ]);

        Sanctum::actingAs($userOutraEmpresa);

        $this->postJson("/api/v1/propostas/{$proposta->id}/documentos/auto-validate")
            ->assertNotFound();
    }
}
