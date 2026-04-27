import random
import string

from django.db import migrations, models


def _gen_slug() -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=16))


def backfill_post_slugs(apps, schema_editor):
    Post = apps.get_model("osolot_server", "Post")
    # Fill any existing rows (or rows created during the migration) with unique slugs.
    for post in Post.objects.filter(slug__isnull=True):
        slug = _gen_slug()
        while Post.objects.filter(slug=slug).exists():
            slug = _gen_slug()
        post.slug = slug
        post.save(update_fields=["slug"])


class Migration(migrations.Migration):
    dependencies = [
        ("osolot_server", "0010_post_membership_shared_posts"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="slug",
            field=models.CharField(max_length=16, null=True, unique=True),
        ),
        migrations.RunPython(backfill_post_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="post",
            name="slug",
            field=models.CharField(max_length=16, unique=True),
        ),
    ]

