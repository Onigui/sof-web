<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropostaRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $cpf = $this->input('cliente_cpf');
        $celular = $this->input('cliente_celular');
        $placa = $this->input('veiculo_placa');
        $renavam = $this->input('veiculo_renavam');

        $this->merge([
            'cliente_cpf' => $cpf ? preg_replace('/\D+/', '', (string) $cpf) : $cpf,
            'cliente_celular' => $celular ? preg_replace('/\D+/', '', (string) $celular) : $celular,
            'veiculo_placa' => $placa ? strtoupper((string) $placa) : $placa,
            'veiculo_renavam' => $renavam ? preg_replace('/\D+/', '', (string) $renavam) : $renavam,
        ]);
    }

    public function rules(): array
    {
        return [
            'cliente_nome' => ['required', 'string', 'max:255'],
            'cliente_cpf' => [
                'required',
                'string',
                'size:11',
                function ($attribute, $value, $fail) {
                    if (!$this->isValidCpf($value)) {
                        $fail('CPF inválido.');
                    }
                },
            ],
            'cliente_celular' => ['required', 'string', 'digits_between:10,11'],
            'cliente_email' => ['nullable', 'email', 'max:255'],
            'produto_id' => ['required', 'integer', 'exists:produtos,id'],
            'loja_id' => ['nullable', 'integer', 'exists:lojas,id'],
            'regiao_raw' => ['required', 'string', 'max:255'],
            'regiao_id' => ['nullable', 'integer', 'exists:regioes,id'],
            'banco_id' => ['nullable', 'integer', 'exists:bancos,id'],
            'pv' => ['nullable', 'string', 'max:255'],
            'veiculo_placa' => [
                'nullable',
                'string',
                'max:20',
                Rule::regex('/^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/'),
            ],
            'veiculo_renavam' => ['nullable', 'string', 'digits_between:9,11'],
            'veiculo_descricao' => ['nullable', 'string', 'max:255'],
            'valor_veiculo' => ['nullable', 'numeric', 'min:0'],
            'valor_financiado' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'cliente_cpf.size' => 'CPF deve conter 11 dígitos.',
            'cliente_celular.digits_between' => 'Celular deve conter 10 ou 11 dígitos.',
            'veiculo_placa.regex' => 'Placa inválida.',
            'veiculo_renavam.digits_between' => 'RENAVAM deve conter entre 9 e 11 dígitos.',
            'valor_veiculo.min' => 'Valor do veículo deve ser maior ou igual a zero.',
            'valor_financiado.min' => 'Valor financiado deve ser maior ou igual a zero.',
        ];
    }

    private function isValidCpf(?string $cpf): bool
    {
        if (!$cpf || strlen($cpf) !== 11) {
            return false;
        }

        if (preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            $sum = 0;
            for ($i = 0; $i < $t; $i++) {
                $sum += (int) $cpf[$i] * (($t + 1) - $i);
            }
            $digit = ((10 * $sum) % 11) % 10;
            if ((int) $cpf[$t] !== $digit) {
                return false;
            }
        }

        return true;
    }
}
