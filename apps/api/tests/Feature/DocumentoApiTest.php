<?php

namespace Tests\Feature;

use App\Models\Documento;
use App\Models\Empresa;
use App\Models\Proposta;
use App\Models\Produto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_operador_dono_faz_upload_e_documento_enviado(): void
    {
        Storage::fake();

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
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        Sanctum::actingAs($operador);

        $response = $this->postJson("/api/v1/propostas/{$proposta->id}/documentos", [
            'tipo' => 'CNH',
            'arquivo' => UploadedFile::fake()->image('cnh.jpg'),
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('documentos', [
            'proposta_id' => $proposta->id,
            'status' => Documento::STATUS_ENVIADO,
        ]);
    }

    public function test_operador_de_outra_empresa_nao_acessa_documentos(): void
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
            'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'regiao_raw' => 'Norte',
            'cliente_nome' => 'Outro Cliente',
            'cliente_cpf' => '99988877766',
            'cliente_celular' => '11988887777',
        ]);

        Sanctum::actingAs($operadorA);

        $this->getJson("/api/v1/propostas/{$proposta->id}/documentos")
            ->assertNotFound();
    }

    public function test_analista_valida_invalido_exige_motivo(): void
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
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        $documento = Documento::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'tipo' => 'CNH',
            'arquivo_path' => 'empresas/1/propostas/1/cnh.jpg',
            'mime_type' => 'image/jpeg',
            'tamanho_bytes' => 123,
            'enviado_por' => $operador->id,
            'enviado_em' => now(),
            'status' => Documento::STATUS_ENVIADO,
        ]);

        Sanctum::actingAs($analista);

        $this->patchJson("/api/v1/documentos/{$documento->id}/validar", [
            'status' => Documento::STATUS_INVALIDO,
        ])->assertStatus(422);
    }

    public function test_upload_mesmo_tipo_substitui_anterior(): void
    {
        Storage::fake();

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
            'cliente_nome' => 'Cliente Teste',
            'cliente_cpf' => '12312312399',
            'cliente_celular' => '11977776666',
        ]);

        $anterior = Documento::create([
            'empresa_id' => $empresa->id,
            'proposta_id' => $proposta->id,
            'tipo' => 'CNH',
            'arquivo_path' => 'empresas/1/propostas/1/cnh.jpg',
            'mime_type' => 'image/jpeg',
            'tamanho_bytes' => 123,
            'enviado_por' => $operador->id,
            'enviado_em' => now(),
            'status' => Documento::STATUS_ENVIADO,
        ]);

        Sanctum::actingAs($operador);

        $this->postJson("/api/v1/propostas/{$proposta->id}/documentos", [
            'tipo' => 'CNH',
            'arquivo' => UploadedFile::fake()->image('cnh-nova.jpg'),
        ])->assertCreated();

        $this->assertDatabaseHas('documentos', [
            'id' => $anterior->id,
            'status' => Documento::STATUS_SUBSTITUIDO,
        ]);

        $novo = Documento::query()->latest()->first();

        $this->assertSame($anterior->id, $novo->substitui_documento_id);
    }
}
