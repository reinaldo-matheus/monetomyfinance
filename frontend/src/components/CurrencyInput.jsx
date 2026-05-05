export default function CurrencyInput({ value, onChange, placeholder = "0,00", className, required, testid }) {
    const display = value
        ? Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "";

    const handleChange = (e) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (!raw) { onChange(""); return; }
        const num = (parseInt(raw, 10) / 100).toFixed(2);
        onChange(num);
    };

    return (
        <input
            data-testid={testid}
            type="text"
            inputMode="numeric"
            required={required}
            value={display}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
}