class SteamCatalogAdapter:
    """
    Adapter to STEAM catalog API
    """

    def __init__(self, api_key: str):
        """
        Init.
        :param api_key:
        """
        self._api_key = api_key
