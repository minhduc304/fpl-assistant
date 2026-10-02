class Session < ApplicationRecord
  belongs_to :user

  # Returns [session, raw_token]. Only the digest is persisted — the raw
  # token is shown to the client once and can't be recovered from the DB.
  def self.create_for(user)
    raw_token = SecureRandom.hex(32)
    session = create!(user: user, token_digest: digest(raw_token))
    [session, raw_token]
  end

  def self.authenticate(raw_token)
    return nil if raw_token.blank?

    find_by(token_digest: digest(raw_token))
  end

  def self.digest(raw_token)
    Digest::SHA256.hexdigest(raw_token)
  end
end
