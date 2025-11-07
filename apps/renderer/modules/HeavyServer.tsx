export default async function HeavyServer() {
    // Simular carga pesada
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', border: '2px solid #ccc' }}>
            <h2>Heavy Server Component</h2>
            <p>This component simulates a heavy server-side operation.</p>
        </div>
    );
}

export function Fallback() {
    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', border: '2px dashed #ccc' }}>
            <h2>Loading Heavy Component...</h2>
            <p>Please wait while the heavy component is being loaded.</p>
        </div>
    );
}