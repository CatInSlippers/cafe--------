import React from 'react';

export function ListItem({ onClick, icon: Icon, text, style }) {
    return (
    <li
        onClick={onClick}
        className={style}>
        {text}
        {Icon}
    </li>
    )

}
