import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # get product from db or just dummy
        pass
