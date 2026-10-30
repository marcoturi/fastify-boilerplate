Feature: Database transactions

  @user
  Scenario: Repository writes inside a failed transaction are rolled back
    When I create a user inside a transaction that fails
    Then there are 0 users in the database

  @user
  Scenario: Repository writes inside a successful transaction are committed
    When I create a user inside a transaction that succeeds
    Then there are 1 users in the database
