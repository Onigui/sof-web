<?php

use App\Models\Documento;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('proposta_id')->constrained('propostas')->cascadeOnDelete();
            $table->string('tipo');
            $table->string('arquivo_path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('tamanho_bytes')->nullable();
            $table->foreignId('enviado_por')->constrained('users')->cascadeOnDelete();
            $table->dateTime('enviado_em');
            $table->enum('status', [
                Documento::STATUS_ENVIADO,
                Documento::STATUS_VALIDO,
                Documento::STATUS_INVALIDO,
                Documento::STATUS_SUBSTITUIDO,
            ]);
            $table->string('motivo_invalidez')->nullable();
            $table->foreignId('substitui_documento_id')
                ->nullable()
                ->constrained('documentos')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['empresa_id', 'proposta_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos');
    }
};
