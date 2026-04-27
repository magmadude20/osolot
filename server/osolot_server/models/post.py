import random
import string

from django.db import models

from ..models.membership import Membership
from .user import User


# Add a random post id, so that ids aren't predictable.
def generate_post_slug():
    return "".join(random.choices(string.ascii_letters + string.digits, k=16))


# An Offer or a Request by a user. May be extended to handle Events.
# If needed, model inheritance may be implemented:
# https://docs.djangoproject.com/en/6.0/topics/db/models/#model-inheritance
class Post(models.Model):
    slug = models.SlugField(max_length=16, unique=True, default=generate_post_slug)

    # User who created the post.
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Sharing settings
    share_with_new_collectives_default = models.BooleanField(default=True)
    # TODO: Add friends
    # share_with_new_friends_default = models.BooleanField(default=True)

    # Whether the post is public.
    public = models.BooleanField(default=False)

    # Memberships that this post is shared to
    shared_memberships = models.ManyToManyField(Membership, related_name="shared_posts")

    # Post info visible to other users.
    class PostType(models.TextChoices):
        OFFER = "offer"
        REQUEST = "request"

    type = models.CharField(
        max_length=31, choices=PostType.choices, default=PostType.OFFER
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    # TODO: category (categories?)

    def __str__(self) -> str:
        return self.title
