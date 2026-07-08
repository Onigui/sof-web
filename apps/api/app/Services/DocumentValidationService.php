<?php

namespace App\Services;

use App\Models\Documento;

class DocumentValidationService
{
    private const MIN_SIZE_BYTES = 20000;

    private const IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const PDF_MIME_TYPE = 'application/pdf';

    public function validate(Documento $documento): array
    {
        if (!$documento->mime_type) {
            return $this->invalid('mime_type ausente.');
        }

        $mimeType = strtolower($documento->mime_type);
        if (!in_array($mimeType, array_merge(self::IMAGE_MIME_TYPES, [self::PDF_MIME_TYPE]), true)) {
            return $this->invalid('tipo de arquivo não permitido.');
        }

        if (!$documento->tamanho_bytes || $documento->tamanho_bytes < self::MIN_SIZE_BYTES) {
            return $this->invalid('arquivo muito pequeno/ilegível.');
        }

        $tipo = strtoupper((string) $documento->tipo);
        if (in_array($tipo, ['FOTO_VEICULO', 'SELFIE_ASSIN'], true)) {
            if (!in_array($mimeType, self::IMAGE_MIME_TYPES, true)) {
                return $this->invalid('tipo de documento requer imagem.');
            }
        }

        return [
            'status' => Documento::STATUS_VALIDO,
        ];
    }

    private function invalid(string $motivo): array
    {
        return [
            'status' => Documento::STATUS_INVALIDO,
            'motivo' => $motivo,
        ];
    }
}
