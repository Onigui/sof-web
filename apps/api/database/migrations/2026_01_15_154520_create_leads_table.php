<?php

use App\Models\Lead;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('loja_id')->constrained('lojas')->cascadeOnDelete();
            $table->enum('status', [
                Lead::STATUS_NOVO,
                Lead::STATUS_EM_ANALISE,
                Lead::STATUS_APROVADO,
                Lead::STATUS_RECUSADO,
                Lead::STATUS_CONVERTIDO,
            ])->default(Lead::STATUS_NOVO);
            $table->string('cliente_nome');
            $table->string('cliente_cpf')->nullable();
            $table->string('cliente_celular');
            $table->string('placa')->nullable();
            $table->string('renavam')->nullable();
            $table->string('descricao')->nullable();
            $table->decimal('valor_veiculo', 15, 2)->nullable();
            $table->decimal('entrada', 15, 2)->nullable();
            $table->decimal('valor_solicitado', 15, 2)->nullable();
            $table->foreignId('banco_id')->nullable()->constrained('bancos')->nullOnDelete();
            $table->foreignId('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->text('observacoes')->nullable();
            $table->foreignId('convertido_proposta_id')->nullable()->constrained('propostas')->nullOnDelete();
            $table->timestamps();

            $table->index(['empresa_id', 'loja_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
