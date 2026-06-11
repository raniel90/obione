package br.com.obione.mpo.enums;

/**
 * Modo de preenchimento do atributo MPO:
 * - DIRECT_VALUE: valor inserido manualmente pelo consultor (ex: nome, datas, orçamento)
 * - OBSERVATION_BASED: valor derivado de observações registradas (ex: riscos, mudanças, lições)
 * - HYBRID: aceita tanto valor direto quanto evidência de observação
 */
public enum FillMode {
    DIRECT_VALUE,
    OBSERVATION_BASED,
    HYBRID
}
