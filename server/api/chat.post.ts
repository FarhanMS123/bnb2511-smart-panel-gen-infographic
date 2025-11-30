import { GoogleGenAI } from '@google/genai'
import { readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
    // 1. Read Audio File
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No audio file provided' })
    }

    const audioFile = formData.find(item => item.name === 'audio')
    if (!audioFile) {
        throw createError({ statusCode: 400, statusMessage: 'Audio field missing' })
    }

    // 2. Initialize GoogleGenAI (Vertex AI mode)
    // @ts-ignore
    const project = process.env.VERTEX_PROJECT_ID || 'bnb-marathon-2025-felis-cato'
    // @ts-ignore
    const location = process.env.VERTEX_LOCATION || "global"
    // @ts-ignore
    const modelName = process.env.GEMINI_MODEL || "gemini-3-pro-preview"

    // console.log(process.env)

    if (!project) {
        throw createError({ statusCode: 500, statusMessage: 'VERTEX_PROJECT_ID is not set' })
    }

    const ai = new GoogleGenAI({
        vertexai: true,
        project: project,
        location: location,
    })

    // 3. Define Tools
    const tools = [
        {
            googleSearch: {}
        },
        {
            functionDeclarations: [
                {
                    name: 'search_webcomponents',
                    description: 'Search for web components. Returns a list of available components with their tag names and script URLs.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            query: { type: 'STRING', description: 'The search query for the component (e.g., "chart", "map", "button")' }
                        },
                        required: ['query']
                    }
                },
                {
                    name: 'fetch_url',
                    description: 'Fetch data from a URL. Useful for getting external data like weather, stock prices, etc.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            url: { type: 'STRING', description: 'The URL to fetch' }
                        },
                        required: ['url']
                    }
                },
                {
                    name: 'get_gps_location',
                    description: 'Get the current GPS location of the user (simulated).',
                    parameters: {
                        type: 'OBJECT',
                        properties: {},
                    }
                }
            ]
        }
    ]

    // 4. Configure Generation
    const generationConfig = {
        maxOutputTokens: 65535,
        temperature: 1,
        topP: 0.95,
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' }
        ],
        tools: tools,
    }

    // 5. Process with Gemini
    const audioBase64 = audioFile.data.toString('base64')

    const prompt = `
    You are an AI assistant that builds dynamic dashboards using Web Components.
    The user will speak a request. You need to:
    1. Understand the user's intent.
    2. Use tools to fetch necessary data (GPS, HTTP) if needed.
    3. Search for necessary Web Components using the 'search_webcomponents' tool OR the 'googleSearch' tool.
       - Look for components on webcomponents.org, npmjs.com (via unpkg/jsdelivr), or cdnjs.
       - You can use standard HTML5 tags (video, img, iframe, div) if a custom element is not found.
    4. Construct a JSON response with a list of components to render.
    
    The JSON response should have this structure:
    {
      "components": [
        {
          "is": "tag-name",
          "scriptUrl": "url-to-script.js",
          "props": { "attribute-name": "value" }
        }
      ]
    }

    CRITICAL INSTRUCTIONS:
    - ALWAYS return valid JSON. Never return plain text or apologies.
    - If you cannot find a specific Web Component, use a generic HTML tag (like 'div', 'iframe', 'img') and style it or set props to fulfill the request.
    - For example, for a clock, if you can't find a component, use a 'div' with text content or an 'iframe' to a clock website.
    - For charts, use 'img' with a QuickChart URL if a component is too hard to configure.
    - Search aggressively. Use Google Search to find CDN links for web components (e.g. "wired-elements cdn", "chartjs web component cdn").
  `

    // We use a loop to handle tool calls manually since we want full control
    // and the new SDK's automatic tool execution might need more setup.
    // We'll mimic the previous logic.

    let currentPrompt: any[] = [
        {
            role: 'user', parts: [
                { text: prompt },
                { inlineData: { mimeType: 'audio/webm', data: audioBase64 } }
            ]
        }
    ]

    // Simple loop for up to 5 turns
    for (let i = 0; i < 5; i++) {
        const req = {
            model: modelName,
            contents: currentPrompt,
            config: generationConfig,
        }

        const response = await ai.models.generateContent(req)

        // Check for function calls
        // Note: The structure of response in @google/genai might differ slightly
        // We look for functionCalls in the candidates
        const candidates = response.candidates
        if (!candidates || candidates.length === 0) break

        const content = candidates[0].content
        const parts = content.parts || []

        const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall)

        if (functionCalls.length === 0) {
            // No function calls, we have the final text
            const text = parts.find((p: any) => p.text)?.text || ''
            try {
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
                return JSON.parse(cleanText)
            } catch (e) {
                console.error('Failed to parse JSON:', text)
                return { components: [], raw_response: text }
            }
        }

        // Handle Function Calls
        console.log('Function calls detected:', functionCalls.length)

        // Add the model's response (with function calls) to history
        currentPrompt.push({ role: 'model', parts: parts })

        const functionResponses = []

        for (const call of functionCalls) {
            console.log(`Calling tool: ${call.name} with args:`, call.args)
            let toolResult = {}

            if (call.name === 'search_webcomponents') {
                const query = (call.args as any).query.toLowerCase()

                // Curated Dictionary
                const componentLibrary: Record<string, any[]> = {
                    'chart': [
                        { tagName: 'wired-card', scriptUrl: 'https://unpkg.com/wired-card@2.1.0/lib/wired-card.js?module', description: 'Container' },
                        { tagName: 'img', scriptUrl: '', props: { src: 'https://quickchart.io/chart?c={type:%27bar%27,data:{labels:[%27Q1%27,%27Q2%27,%27Q3%27,%27Q4%27],datasets:[{label:%27Users%27,data:[50,60,70,180]}]}}', style: 'width: 100%;' } }
                    ],
                    'map': [
                        { tagName: 'iframe', scriptUrl: '', props: { width: '100%', height: '300', frameborder: '0', src: 'https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik' } }
                    ],
                    'button': [
                        { tagName: 'wired-button', scriptUrl: 'https://unpkg.com/wired-button@2.1.0/lib/wired-button.js?module' }
                    ],
                    'card': [
                        { tagName: 'wired-card', scriptUrl: 'https://unpkg.com/wired-card@2.1.0/lib/wired-card.js?module' }
                    ],
                    'input': [
                        { tagName: 'wired-input', scriptUrl: 'https://unpkg.com/wired-input@2.1.0/lib/wired-input.js?module' }
                    ],
                    'video': [
                        { tagName: 'video', scriptUrl: '', props: { controls: true, src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', style: 'width: 100%' } }
                    ]
                }

                let results: any[] = []
                Object.keys(componentLibrary).forEach(key => {
                    if (query.includes(key) || key.includes(query)) {
                        results = results.concat(componentLibrary[key])
                    }
                })

                if (results.length === 0) {
                    results = [
                        { tagName: 'wired-card', scriptUrl: 'https://unpkg.com/wired-card@2.1.0/lib/wired-card.js?module', description: 'Generic Card' }
                    ]
                }

                toolResult = { results }
            } else if (call.name === 'fetch_url') {
                const url = (call.args as any).url
                try {
                    const data = await $fetch(url)
                    toolResult = { data }
                } catch (e) {
                    toolResult = { error: 'Failed to fetch URL' }
                }
            } else if (call.name === 'get_gps_location') {
                toolResult = { lat: -6.2088, lng: 106.8456, city: 'Jakarta' }
            }

            functionResponses.push({
                functionResponse: {
                    name: call.name,
                    response: { name: call.name, content: toolResult }
                }
            })
        }

        // Add function responses to history
        currentPrompt.push({ role: 'function', parts: functionResponses })
    }

    return { components: [], error: 'Max turns reached or no valid JSON response' }
})
