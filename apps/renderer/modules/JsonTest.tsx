export default async function JsonTest() {
    // APIs públicas con JSONs grandes:

    // Opción 1: JSONPlaceholder - 5000 posts (~500KB)
    const response = await fetch('https://jsonplaceholder.typicode.com/photos');
    const photos = await response.json();

    // Opción 2: GitHub API - repos (más datos)
    // const response = await fetch('https://api.github.com/users/microsoft/repos?per_page=100');

    // Opción 3: Rick and Morty API - todos los personajes
    // const response = await fetch('https://rickandmortyapi.com/api/character');

    // Opción 4: Pokemon API - lista completa
    // const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');

    const dataSize = JSON.stringify(photos).length;
    const dataSizeKB = (dataSize / 1024).toFixed(2);

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', border: '2px solid #ccc' }}>
            <h2>🌐 Server-Side JSON Test</h2>
            <p><strong>Data fetched on server:</strong> {photos.length} items</p>
            <p><strong>Total size:</strong> {dataSizeKB} KB</p>
            <p style={{ fontSize: '12px', color: '#666' }}>
                ✅ This JSON was fetched on the server and never sent to the client.
            </p>

            <details>
                <summary>Show first 5 items</summary>
                <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(photos.slice(0, 5), null, 2)}
                </pre>
            </details>
        </div>
    );
}
