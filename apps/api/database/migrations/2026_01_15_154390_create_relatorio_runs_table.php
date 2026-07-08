<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relatorio_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->date('data_ref');
            $table->enum('tipo', ['APROVADAS', 'INTEGRADAS']);
            $table->string('formato')->default('xlsx');
            $table->string('arquivo_path');
            $table->enum('status', ['GERADO', 'FALHOU']);
            $table->text('erro')->nullable();
            $table->dateTime('gerado_em');
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['empresa_id', 'data_ref', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relatorio_runs');
    }
};
