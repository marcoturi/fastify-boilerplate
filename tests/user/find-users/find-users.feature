Feature: Find users

  Background: Existing users
    Given these users exist
      | email              | country | street      | postalCode |
      | mario.rossi@pec.it | Italy   | Via Roma    | 10100      |
      | anna.verdi@pec.it  | Italy   | Via Po      | 10124      |
      | john.doe@gmail.com | England | Road Avenue | 29145      |

  @user
  Scenario: I can page through all users
    When I page through the users 1 at a time
    Then I see every user exactly once, newest first

  @user
  Scenario Outline: I try to list users with invalid pagination
    When I request the users with "<Query>"
    Then I receive an error "Bad Request" with status code 400

    Examples:
      | Query        |
      | limit=2.5    |
      | limit=0      |
      | page=-1      |
      | limit=100000 |
