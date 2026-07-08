<?php

use App\Models\Proposta;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('propostas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('operador_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('analista_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('loja_id')->nullable()->constrained('lojas')->nullOnDelete();
            $table->string('regiao_raw');
            $table->foreignId('regiao_id')->nullable()->constrained('regioes')->nullOnDelete();
            $table->foreignId('banco_id')->nullable()->constrained('bancos')->nullOnDelete();
            $table->foreignId('produto_id')->constrained('produtos')->cascadeOnDelete();
            $table->enum('status', [
                Proposta::STATUS_RASCUNHO,
                Proposta::STATUS_ANALISE_PROMOTORA,
                Proposta::STATUS_ANALISE_BANCO,
                Proposta::STATUS_APROVADA,
                Proposta::STATUS_RECUSADA,
                Proposta::STATUS_FORMALIZACAO,
                Proposta::STATUS_ANALISE_PAGAMENTO,
                Proposta::STATUS_INTEGRADA,
                Proposta::STATUS_CANCELADA,
            ]);
            $table->enum('prioridade', [
                Proposta::PRIORIDADE_NORMAL,
                Proposta::PRIORIDADE_ALTA,
            ])->default(Proposta::PRIORIDADE_NORMAL);
            $table->string('pv')->nullable();
            $table->string('cliente_nome');
            $table->string('cliente_cpf');
            $table->string('cliente_celular');
            $table->string('cliente_email')->nullable();
            $table->string('veiculo_placa')->nullable();
            $table->string('veiculo_renavam')->nullable();
            $table->string('veiculo_descricao')->nullable();
            $table->decimal('valor_veiculo', 15, 2)->nullable();
            $table->decimal('valor_financiado', 15, 2)->nullable();
            $table->dateTime('enviada_em')->nullable();
            $table->dateTime('aprovada_em')->nullable();
            $table->dateTime('integrada_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('propostas');
    }
};
