<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->enum('tipo_evento', ['INTEGRADA']);
            $table->foreignId('proposta_id')->nullable()->constrained('propostas')->nullOnDelete();
            $table->foreignId('integracao_id')->nullable()->constrained('integracoes')->nullOnDelete();
            $table->integer('valor_centavos');
            $table->dateTime('gerado_em');
            $table->timestamps();

            $table->unique(['empresa_id', 'tipo_evento', 'proposta_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_events');
    }
};
