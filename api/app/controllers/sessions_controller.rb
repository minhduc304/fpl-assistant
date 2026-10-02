# POST/DELETE /sessions, GET /me (openapi.yaml's login/logout/getCurrentUser operations).
class SessionsController < ApplicationController
  include Authenticatable
  skip_before_action :authenticate_user!, only: [:create]

  def create
    user = User.find_by(email: params[:email]&.strip&.downcase)
    if user&.authenticate(params[:password])
      _session, raw_token = Session.create_for(user)
      render json: { token: raw_token, user: serialize(user) }, status: :created
    else
      render json: { message: "Incorrect email or password" }, status: :unauthorized
    end
  end

  def destroy
    @current_session.destroy
    head :no_content
  end

  def show
    render json: serialize(current_user), status: :ok
  end

  private

  def serialize(user)
    { email: user.email, fpl_team_id: user.fpl_team_id }
  end
end
