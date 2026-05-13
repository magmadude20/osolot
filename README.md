# osolot: Open Source Organic Libraries of Things

osolot helps people pool their resources.

You can use my printer, and maybe I can borrow your wheelbarrow.
People already do this, but now we can insert technology in the mix. That will surely make things better.

Coordinating that across lots of people is hard, and this aims to make that easier.

## Features

* Personal profile and inventory of your stuff
* Start or join multiple groups ("collectives")
* Collective admins & moderators
* Individual collective settings (public/private, anyone can join / require approval)
* Precise sharing controls for each collective
* View/request stuff shared with you across all collectives
* Friends

## Why?

I think this addresses a gap in the market. There are some apps that can be used for similar things, but they fall short in various ways.

Craigslist

* Public postings only
* Transactions, not borrowing
* Postings expire

Facebook groups (e.g. buy nothing) or group chats

* No clear 'inventory', especially for older posts
* Often giving things away, not lending them

Nextdoor

* Same problems: transactions, feeds, no inventory besides what is recently offered

Similar projects, that are just a bit off from what I'm imagining. They may work better for your use case:

* [Peerby](https://www.peerby.com/en-us)
* [Neigborgoods](http://neighborgoods.com)
* [Bonfire](http://bonfirenetworks.org)
* [Inventaire](https://inventaire.io/)
* [Borrowme](https://borrowme.co/)
* [Community Gearbox](https://communitygearbox.com/)
* [Community Supplies](https://communitysupplies.org)

## On trust

This is not expected to be a 'lend to random strangers' app.

Trust should be established off the app.\
Accountability should be handled off the app.

It's on you to decide whether you trust someone enough to share with them.

But also, just be nice.

## "Organic"?

Partly, it makes the acronym work, but it's also part of the goal.

Collectives can start with just a few people, and grow organically from there.

In theory, the larger a collective, the better it is for each person in it.

## Technologies used

* [Supabase](https://supabase.com/) - auth + postgres database
* [Cloudflare Workers](https://www.cloudflare.com/products/workers/) - serverless functions
* [Expo](https://expo.dev/) - cross-platform app
* [Zod](https://zod.dev/) - client <-> server API schema
