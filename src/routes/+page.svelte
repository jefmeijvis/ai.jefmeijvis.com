<script lang="ts">
    import type { Block } from "$lib/business/block";
    import type { Token } from "$lib/business/token";
    import { fade } from 'svelte/transition';

    let question : string = ""
    let blocks : Block[] = new Array<Block>();
    let busy : boolean = false;

    let startBlock = {} as Block;
    startBlock.type = 'answer';

    let startToken = {} as Token
    startToken.content = "Stel een vraag! Door de huidige infrastructuur is de maximale duur van een antwoord 10 seconden."
    startBlock.tokens = new Array<Token>();
    startBlock.tokens.push(startToken)
    startBlock.busy = false;
    blocks.push(startBlock);

    let controller = new AbortController();
    let signal = controller.signal

    async function generate()
    {
        if(question == '')
            return;

        busy = true;

        controller = new AbortController();
        signal = controller.signal;

        console.log("START GENERATE")
        let url : string = "/api/generate?prompt=" + question;

        let block : Block = {} as Block;
        block.type = 'question';
        block.tokens = new Array<Token>();
        let token : Token = {} as Token;
        token.content = question;
        block.tokens.push(token);
        block.busy = false;
        blocks.push(block);
        blocks = blocks;

        let requestInit : RequestInit = 
        {
            method : 'GET',
            signal: signal, // <------ This is our AbortSignal
        };

        let answerBlock : Block = {} as Block;
        answerBlock.type = 'answer';
        answerBlock.tokens = new Array<Token>();
        answerBlock.busy = true;
        blocks.push(answerBlock);
        question = "";


        fetch(url,requestInit)
            // Retrieve its body as ReadableStream
            .then((response) => {

                //@ts-ignore
                const reader = response.body.getReader();
                // read() returns a promise that resolves when a value has been received
                //@ts-ignore
                reader.read().then(function pump({ done, value }) 
                {

                if (done) 
                {
                    answerBlock.busy = false;
                    blocks = blocks;
                    busy = false;
                    // Do something with last chunk of data then exit reader
                    return;
                }
                let token : Token = {} as Token;

                let reply = new TextDecoder().decode(value);
                reply = reply.replace('data:','');
                console.dir(reply)
                let obj = JSON.parse(reply);
  

                //@ts-ignore
                token.content = obj.response;
                blocks.at(-1)?.tokens.push(token);
                // Read some more, and call this function again
                blocks = blocks;

                if (obj.done) 
                {
                    answerBlock.busy = false;
                    answerBlock.comment = 'Evaluation took ' + Math.floor(Number.parseInt(obj.duration) / 1000_000_000) + " seconds";
                    blocks = blocks;
                    busy = false;
                    // Do something with last chunk of data then exit reader
                    return;
                }

                return reader.read().then(pump);
                });
            })
            .catch(onError);
    }

    function onError(error : any)
    {
        busy = false;
        blocks[blocks.length -1].busy = false;
        let token : Token = {} as Token;
        token.content = "[ERROR]";
        blocks[blocks.length -1].tokens.push(token);
        blocks = blocks;
        console.log(error)
    }

    async function cancel()
    {
        if(!busy)
            return;
        
        try
        {
            blocks[blocks.length -1].busy = false;
            blocks[blocks.length -1].tokens[blocks[blocks.length -1].tokens.length -1].content += " [GEANNULEERD]"
            blocks = blocks;
            busy = false;
            if(controller.signal.aborted)
            {
                console.log("Request signal was already aborted");
            }
            else
            {
                controller.abort();
                console.log("Request signal is now aborted")
            }
        }
        catch(e)
        {
            console.log("Request was aborted!")
        }
    }
</script>

<div class="header">
    <h1>dotNET lab GPT</h1>
</div>
<div class="chat">
    {#each blocks as block}
        <p class:busy={block.busy} class:answer={block.type == 'answer'} class:question={block.type == 'question'}>
            <b class="person">
                {block.type == 'answer' ? 'AI' : 'YOU'}
                {block.busy ? ' [Thinking...]' : ''}
                :
            </b>
            <br>
            {#each block.tokens as token}
                <span transition:fade>
                    {token.content}
                </span>
            {/each}

            {#if block.comment != undefined}
                <br>
                <span class="comment">
                    <i>
                        {block.comment}
                    </i>
                </span>
            {/if}
        </p>
    {/each}
</div>
<div class="controls">
    <textarea placeholder="Enter your question here" bind:value={question}/>
    <button on:click={generate}>Generate</button>
    <button class:inactive={!busy} on:click={cancel}>Cancel</button>
</div>

<style>
    .comment
    {
        opacity: 20%;
    }

    .inactive
    {
        background-color: grey;
        cursor:not-allowed;
    }

    .inactive:hover
    {
        opacity: 100%;
    }

    button
    {
        display: inline-block;
        width: 49%;
        margin:auto;
        background-color: var(--color-blue);
        color:white;
        border:none;
        font-weight: bold;
        padding: .5rem;
        border-radius: .5rem;
        cursor:pointer;
    }

    button:hover
    {
        opacity: 70%;
    }
    .controls
    {
        text-align: center;
    }
    .chat,.controls
    {
        width : 60%;
        margin: auto;
    }

    .chat
    {
        margin-top: .5rem;
        border-radius: .5rem;
        margin-bottom: .5rem;
        height: 70vh;
        overflow-y: auto;
    }

    textarea
    {
        width: calc(100% - 1rem);
        border: 1px var(--color-blue) solid;
        border-radius: .5rem;
        padding: .5rem;
        background: white;
    }

    textarea:focus
    {
        border: 1px var(--color-blue) solid;
        outline: none;
    }

    .person
    {
        color:var(--color-blue);
    }

    h1
    {
        margin:0;
        padding: 1rem;
        color:white;
    }
    .header
    {
        background-color: var(--color-blue);
    }
    .answer,.question
    {
        padding: 1rem;
        border-radius: .5rem;
    }

    .busy
    {
        animation: fade 2s;
        animation-iteration-count: infinite;
    }

    @keyframes fade 
    {
        0% {opacity: 100%;}
        50% {opacity: 100%;}
        100% {opacity: 100%;}
    }

    @media (max-aspect-ratio: 1/1) 
    {
        .chat,.controls
        {
            width : 90%;
            margin: auto;
        }
    }
</style>