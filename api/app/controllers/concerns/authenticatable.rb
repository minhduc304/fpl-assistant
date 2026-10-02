module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    header = request.headers["Authorization"]
    raw_token = header&.start_with?("Bearer ") ? header.delete_prefix("Bearer ") : nil
    @current_session = Session.authenticate(raw_token)

    render json: { message: "Not authenticated" }, status: :unauthorized unless @current_session
  end

  def current_user
    @current_session&.user
  end
end
