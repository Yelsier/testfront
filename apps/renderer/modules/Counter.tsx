"use client";

import { useState } from "react";

const Counter = () => {

    const [count, setCount] = useState(0);

    const increment = () => {
        setCount(count + 1);
    };

    return (
        <div>
            <h2>Counter Module</h2>
            <p>This is the Counter module.</p>
            <p>Current count: {count}</p>
            <button onClick={increment}>Increment</button>
        </div>
    );
}

export default Counter;