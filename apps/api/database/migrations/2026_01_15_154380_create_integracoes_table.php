<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integracoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('proposta_id')->constrained('propostas')->cascadeOnDelete();
            $table->date('data_averbacao');
            $table->string('contrato');
            $table->decimal('repasse', 12, 2)->nullable();
            $table->string('tabela')->nullable();
            $table->string('veiculo')->nullable();
            $table->boolean('alienado')->default(false);
            $table->string('regiao_override')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique('proposta_id');
            $table->index(['empresa_id', 'data_averbacao']);
            $table->index(['empresa_id', 'proposta_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integracoes');
    }
};
