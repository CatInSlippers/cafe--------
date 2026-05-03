import React from "react";
import { Circle, Rect, Group } from "react-konva";

export const ChairsRenderer = React.memo(({ color: COLORS, seats, type, width, height, radius, stroke }) => {
    if (!seats) return null;

    const chairSize = 20;
    const gap = 5;
    const chairs = [];

    if (type === 'round_table') {
        const r = radius + chairSize / 2 + gap;
        for (let i = 0; i < seats; i++) {
            const angle = (i * 2 * Math.PI) / seats;
            chairs.push(
                <Circle key={i} x={Math.cos(angle) * r} y={Math.sin(angle) * r} radius={chairSize / 2} fill={COLORS.FURNITURE_DEFAULT} stroke="white" strokeWidth={1} />
            );
        }
    } else {
        const sideCount = Math.ceil(seats / 2);
        const spacingX = width / (sideCount + 1);
        for (let i = 0; i < seats; i++) {
            const isTop = i < sideCount;
            const indexOnSide = isTop ? i : (i - sideCount);
            const cx = spacingX * (indexOnSide + 1);
            const cy = isTop ? -chairSize / 2 - gap : height + chairSize / 2 + gap;
            chairs.push(
                <Rect key={i} x={cx - chairSize / 2} y={cy - chairSize / 2} width={chairSize} height={chairSize} cornerRadius={5} fill={COLORS.FURNITURE_DEFAULT} stroke={stroke} strokeWidth={1} opacity={0.8} />
            );
        }
    }
    return <Group listening={false}>{chairs}</Group>;
});