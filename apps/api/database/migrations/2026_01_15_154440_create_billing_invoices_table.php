<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('referencia_mes');
            $table->enum('status', ['DRAFT', 'OPEN', 'PAID', 'VOID', 'FAILED']);
            $table->string('currency')->default('BRL');
            $table->integer('monthly_fee_centavos');
            $table->integer('variable_fee_centavos');
            $table->integer('total_centavos');
            $table->date('due_date')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->string('provider')->nullable();
            $table->string('provider_invoice_id')->nullable();
            $table->text('provider_checkout_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'referencia_mes']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_invoices');
    }
};
