# API Builders

These files handle conversion from database models to API schemas.

Importantly, they also manage field visibility logic.\
For example, the only users who can view a user's application to join a collective
are 1) the user themself and 2) admins/moderators of the collective.

In the future it could be refactored to manage more complex logic, 
e.g. a user may wish to only display thier first name and last initial to members of a collective.
