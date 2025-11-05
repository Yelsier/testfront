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