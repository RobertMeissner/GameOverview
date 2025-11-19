from workers import WorkerEntrypoint, Response


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        query = """SELECT app_id from games"""
        results = await self.env.DB.prepare(query).all()
        data = results.results[0]

        return Response.json(data)
