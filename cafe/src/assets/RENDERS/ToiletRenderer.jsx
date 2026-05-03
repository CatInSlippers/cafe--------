import React from "react";
import { Line, Rect, Circle, Group } from "react-konva";

export const ToiletRenderer = React.memo(({ color: COLORS, GRID_SIZE, TOILET_TYPES, width, height, cabins = 2, gender = 'unisex', stroke }) => {
    const tiles = [];
    // Малюємо лінії плитки тільки якщо зона достатньо велика, щоб не перевантажувати рендер
    if (width > 40 && height > 40) {
        for (let x = GRID_SIZE; x < width; x += GRID_SIZE) {
            tiles.push(<Line key={`v-${x}`} points={[x, 0, x, height]} stroke={COLORS.GRID} strokeWidth={1} listening={false} />);
        }
        for (let y = GRID_SIZE; y < height; y += GRID_SIZE) {
            tiles.push(<Line key={`h-${y}`} points={[0, y, width, y]} stroke={COLORS.GRID} strokeWidth={1} listening={false} />);
        }
    }

    // 2. Кабінки (Cabins)
    const cabinVisuals = [];
    const cabinWidth = width / cabins;
    const cabinDepth = Math.min(height * 0.6, 60);
    const doorSize = cabinWidth * 0.8;

    for (let i = 0; i < cabins; i++) {
        const xPos = i * cabinWidth;

        // Перегородка
        cabinVisuals.push(
            <Rect
                key={`cabin-${i}`}
                x={xPos + 2}
                y={0}
                width={cabinWidth - 4}
                height={cabinDepth}
                stroke={COLORS.STATUS_BROKEN}
                strokeWidth={2}
                fill="white"
            />
        );

        // "Двері" кабінки (просто лінія або акцент)
        cabinVisuals.push(
            <Line
                key={`door-${i}`}
                points={[xPos + (cabinWidth - doorSize) / 2, cabinDepth, xPos + (cabinWidth + doorSize) / 2, cabinDepth]}
                stroke={stroke}
                strokeWidth={3}
            />
        );

        // Умовний "унітаз" (коло всередині)
        if (cabinWidth > 15) {
            cabinVisuals.push(
                <Circle key={`toilet-${i}`} x={xPos + cabinWidth / 2} y={cabinDepth / 2} radius={Math.min(cabinWidth / 4, 10)} fill={COLORS.STATUS_BROKEN} opacity={0.3} />
            );
        }
    }

    // 3. Маркер типу (смужка кольору)
    const typeColor = TOILET_TYPES.find(t => t.value === gender)?.color || COLORS.GENDER_UNISEX;

    return (
        <Group>
            {/* Підлога */}
            <Rect width={width} height={height} fill={COLORS.TOILET_BG} stroke={stroke} strokeWidth={2} />

            {/* Плитка */}
            <Group clipFunc={(ctx) => { ctx.rect(2, 2, width - 4, height - 4); }}>
                {tiles}
            </Group>

            {/* Кабінки */}
            {cabinVisuals}

            {/* Кольоровий індикатор входу/типу */}
            <Rect x={0} y={height - 5} width={width} height={5} fill={typeColor} />

            {/* Умивальники (спрощено: просто кружечки навпроти кабінок, якщо є місце) */}
            {height - cabinDepth > 30 && (
                <Group y={height - 15}>
                    {Array.from({ length: Math.max(1, Math.floor(cabins / 1.5)) }).map((_, i) => (
                        <Circle key={`sink-${i}`} x={(i + 1) * (width / (Math.floor(cabins / 1.5) + 1))} y={0} radius={8} stroke={COLORS.STATUS_BROKEN} fill="white" />
                    ))}
                </Group>
            )}
        </Group>
    );
});