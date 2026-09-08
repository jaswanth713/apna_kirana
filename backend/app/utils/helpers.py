import re
import unicodedata


def slugify(text: str) -> str:
    """
    Converts text to a URL-friendly lowercase slug.
    Example: 'Britannia Good Day (200g)!' -> 'britannia-good-day-200g'
    """
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)
