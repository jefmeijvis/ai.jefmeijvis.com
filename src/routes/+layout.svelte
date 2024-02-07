<slot></slot>
<img class="line-1" alt="background-lines" src="/line-4.svg"/>
<img class="line-2" alt="background-lines" src="/line-3.svg"/>

<style>
    .line-1
    {
        width : 30rem;
        left: -10rem;
        top : 10rem;
        transform: rotate(270deg);
    }

    .line-2
    {
        width : 15rem;
        right: -2rem;
        top : 3rem;
        transform: rotate(250deg);
    }

    img
    {
        position: absolute;
        pointer-events: none;
        opacity: 30%;
        z-index: -1;
    }

    @media (max-aspect-ratio: 1/1)
    {
        img
        {
            opacity: 10%;
        }
    }

</style>